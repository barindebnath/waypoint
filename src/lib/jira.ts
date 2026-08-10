export interface JiraIssueStatus {
  statusName: string;
  statusCategory: 'todo' | 'inprogress' | 'done';
}

export async function fetchJiraIssueStatus(
  jiraBaseUrl: string,
  email: string,
  apiToken: string,
  issueKey: string
): Promise<JiraIssueStatus | null> {
  try {
    const cleanUrl = jiraBaseUrl.replace(/\/+$/, '');
    const authHeader = 'Basic ' + Buffer.from(`${email}:${apiToken}`).toString('base64');
    const res = await fetch(`${cleanUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=status`, {
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const statusObj = data.fields?.status;
    if (!statusObj) return null;

    const categoryKey = statusObj.statusCategory?.key;
    let statusCategory: JiraIssueStatus['statusCategory'] = 'inprogress';
    if (categoryKey === 'new' || categoryKey === 'undefined') statusCategory = 'todo';
    else if (categoryKey === 'done') statusCategory = 'done';

    return {
      statusName: statusObj.name || 'Unknown',
      statusCategory,
    };
  } catch (err) {
    console.error('Failed to fetch Jira status:', err);
    return null;
  }
}

export async function fetchJiraIssueId(
  jiraBaseUrl: string,
  email: string,
  apiToken: string,
  issueKey: string
): Promise<string | null> {
  try {
    const cleanUrl = jiraBaseUrl.replace(/\/+$/, '');
    const authHeader = 'Basic ' + Buffer.from(`${email}:${apiToken}`).toString('base64');
    const res = await fetch(`${cleanUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=id`, {
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id ? String(data.id) : null;
  } catch (err) {
    console.error(`Failed to fetch Jira issue ID for ${issueKey}:`, err);
    return null;
  }
}

