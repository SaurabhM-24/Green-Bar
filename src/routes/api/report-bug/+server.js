import { json } from '@sveltejs/kit';
import { GITHUB_PAT, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } from '$env/static/private';

export async function POST({ request }) {
	try {
		const { title, description } = await request.json();

		if (!title || !description) {
			return json({ error: 'Title and description are required' }, { status: 400 });
		}

		if (!GITHUB_PAT || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
			console.error('GitHub Issues API configuration is missing in environment variables.');
			return json({ error: 'Bug reporting is currently unavailable (Server Configuration Error).' }, { status: 500 });
		}

		const githubApiUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues`;
		
		const issueBody = `**Bug Report**\n\n**Description:**\n${description}`;

		const response = await fetch(githubApiUrl, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${GITHUB_PAT}`,
				'Accept': 'application/vnd.github.v3+json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				title: `[Bug] ${title}`,
				body: issueBody,
				labels: ['bug', 'user-reported']
			})
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error('GitHub API Error:', errorData);
			return json({ error: 'Failed to create bug report on GitHub.' }, { status: response.status });
		}

		const issueData = await response.json();

		return json({ 
			success: true, 
			message: 'Bug report submitted successfully.',
			issueUrl: issueData.html_url
		}, { status: 201 });

	} catch (error) {
		console.error('Error submitting bug report:', error);
		return json({ error: 'An unexpected error occurred while submitting the bug report.' }, { status: 500 });
	}
}
