const { stripIndent } = require("common-tags")

async function action() {
    const { stripIndent } = require("common-tags");

    const core = require("@actions/core");
    const github = require("@actions/github");

    const event = process.env.GITHUB_EVENT_NAME;
    const payload = require(process.env.GITHUB_EVENT_PATH);

    if (event != "pull_request" || payload.action != "closed") {
        core.setFailed(stripIndent`
            This action only runs on pull_request.closed
            Found: ${event}.${payload.action}
        `);
        return;
    }

    if (!payload.pull_request.merged) {
        core.warning("Pull request closed without merge");
        return;
    }

    const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

    let pulls = await octokit.paginate(
        "GET /repos/:owner/:repo/pulls",
        {
            ...github.context.repo,
            state: "closed",
            per_page: 100,
        },
        (response)  => response.data
    );

    const expectedAuthor = payload.pull_request.user.login;
    pulls = pulls.filter((p) => {
        if (!p.merged_at) {
            return false;
        }

        return p.user.login == expectedAuthor;
    });

    const pullCount = pulls.length;
    const message = core.getInput(`merged_${pullCount}`);
    if (!message) {
        console.log("No action required");
        return;
    }

    await octokit.issues.createComment({
        ...github.context.repo,
        issue_number: github.context.issue.number,
        body: message,
    });

    console.log(stripIndent`
        Added comment:
        ${message}
    `);

    await octokit.issues.addLabels({
        ...github.context.repo,
        issue_number: github.context.issue.number,
        labels: ['merge-milestone', `merge-milestone:${pullCount}`]
    })
}

if (require.main === module) {
    action();
}

module.exports = action;