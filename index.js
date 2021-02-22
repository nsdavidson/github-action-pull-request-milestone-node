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
}

if (require.main === module) {
    action();
}

module.exports = action;