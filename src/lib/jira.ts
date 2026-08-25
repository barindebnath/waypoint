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

export async function fetchJiraIssueSummary(
  jiraBaseUrl: string,
  email: string,
  apiToken: string,
  issueKey: string
): Promise<string | null> {
  try {
    const cleanUrl = jiraBaseUrl.replace(/\/+$/, '');
    const authHeader = 'Basic ' + Buffer.from(`${email}:${apiToken}`).toString('base64');
    const res = await fetch(`${cleanUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=summary`, {
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.fields?.summary ? String(data.fields.summary) : null;
  } catch (err) {
    console.error(`Failed to fetch Jira summary for ${issueKey}:`, err);
    return null;
  }
}

export interface JiraIssueDetails {
  id: string;
  summary?: string;
  investmentCategory?: string;
  issueType?: string;
}

export async function fetchJiraIssueDetails(
  jiraBaseUrl: string,
  email: string,
  apiToken: string,
  issueKey: string
): Promise<JiraIssueDetails | null> {
  try {
    const cleanUrl = jiraBaseUrl.replace(/\/+$/, '');
    const authHeader = 'Basic ' + Buffer.from(`${email}:${apiToken}`).toString('base64');
    const res = await fetch(
      `${cleanUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=id,summary,customfield_11663,issuetype`,
      {
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.id) return null;

    let investmentCategory: string | undefined;
    const rawCat = data.fields?.customfield_11663;
    if (typeof rawCat === 'string') {
      investmentCategory = rawCat;
    } else if (rawCat && typeof rawCat === 'object' && 'value' in rawCat) {
      investmentCategory = String(rawCat.value);
    }

    return {
      id: String(data.id),
      summary: data.fields?.summary ? String(data.fields.summary) : undefined,
      investmentCategory,
      issueType: data.fields?.issuetype?.name ? String(data.fields.issuetype.name) : undefined,
    };
  } catch (err) {
    console.error(`Failed to fetch Jira issue details for ${issueKey}:`, err);
    return null;
  }
}




