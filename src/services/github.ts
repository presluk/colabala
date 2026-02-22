const API = 'https://api.github.com';
const DATA_BRANCH = 'data';

interface FileInfo {
  content: string;
  sha: string;
}

interface AuthConfig {
  token: string;
  owner: string;
  repo: string;
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

async function ensureDataBranch(config: AuthConfig): Promise<void> {
  const { token, owner, repo } = config;

  // Check if data branch exists
  const res = await fetch(`${API}/repos/${owner}/${repo}/branches/${DATA_BRANCH}`, {
    headers: headers(token),
  });

  if (res.ok) return;

  // Try to seed the data branch by creating an initial file.
  // This works even on completely empty repos — the GitHub Contents API
  // creates the branch automatically if it doesn't exist.
  const seedRes = await fetch(`${API}/repos/${owner}/${repo}/contents/_initialized`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({
      message: '[Colabala] Initialize data branch',
      content: btoa('initialized'),
      branch: DATA_BRANCH,
    }),
  });

  if (!seedRes.ok && seedRes.status !== 422) {
    throw new Error('Nelze vytvořit datovou větev');
  }
}

export async function readFile(
  config: AuthConfig,
  path: string,
): Promise<FileInfo | null> {
  const { token, owner, repo } = config;
  const res = await fetch(
    `${API}/repos/${owner}/${repo}/contents/${path}?ref=${DATA_BRANCH}`,
    { headers: headers(token) },
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Chyba čtení souboru: ${res.status}`);

  const data = await res.json();
  return {
    content: atob(data.content),
    sha: data.sha,
  };
}

export async function writeFile(
  config: AuthConfig,
  path: string,
  content: string,
  message: string,
  sha?: string,
): Promise<string> {
  const { token, owner, repo } = config;
  const body: Record<string, string> = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: DATA_BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    if (res.status === 409) throw new Error('CONFLICT');
    throw new Error(`Chyba zápisu: ${res.status}`);
  }

  const data = await res.json();
  return data.content.sha;
}

// High-level data operations

export async function validateToken(config: AuthConfig): Promise<boolean> {
  try {
    const res = await fetch(`${API}/repos/${config.owner}/${config.repo}`, {
      headers: headers(config.token),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function initializeStorage(config: AuthConfig): Promise<void> {
  await ensureDataBranch(config);
}

export async function readJsonFile<T>(
  config: AuthConfig,
  filename: string,
  defaultValue: T,
): Promise<{ data: T; sha: string | null }> {
  const result = await readFile(config, `${filename}.json`);
  if (!result) return { data: defaultValue, sha: null };
  try {
    return { data: JSON.parse(result.content) as T, sha: result.sha };
  } catch {
    return { data: defaultValue, sha: result.sha };
  }
}

export async function writeJsonFile<T>(
  config: AuthConfig,
  filename: string,
  data: T,
  message: string,
  sha?: string,
): Promise<string> {
  const content = JSON.stringify(data, null, 2);

  // If we have a sha, try direct write
  if (sha) {
    try {
      return await writeFile(config, `${filename}.json`, content, message, sha);
    } catch (e) {
      if (e instanceof Error && e.message === 'CONFLICT') {
        // Re-read to get latest sha, then retry
        const latest = await readFile(config, `${filename}.json`);
        if (latest) {
          return await writeFile(config, `${filename}.json`, content, message, latest.sha);
        }
      }
      throw e;
    }
  }

  return await writeFile(config, `${filename}.json`, content, message);
}
