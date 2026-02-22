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

  // Get default branch SHA
  const repoRes = await fetch(`${API}/repos/${owner}/${repo}`, {
    headers: headers(token),
  });
  if (!repoRes.ok) throw new Error('Nelze přistoupit k repozitáři');
  const repoData = await repoRes.json();

  const refRes = await fetch(
    `${API}/repos/${owner}/${repo}/git/ref/heads/${repoData.default_branch}`,
    { headers: headers(token) },
  );
  if (!refRes.ok) throw new Error('Nelze získat výchozí větev');
  const refData = await refRes.json();

  // Create data branch
  const createRes = await fetch(`${API}/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      ref: `refs/heads/${DATA_BRANCH}`,
      sha: refData.object.sha,
    }),
  });

  if (!createRes.ok && createRes.status !== 422) {
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
