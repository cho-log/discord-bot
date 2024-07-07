package cholog.github;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

@FeignClient(
        name = "github",
        url = "https://api.github.com",
        configuration = GithubApiConfiguration.class
)
public interface GithubApi {

    // Note: https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#get-a-pull-request
    @GetMapping("/repos/{owner}/{repo}/pulls/{pull_number}")
    PullRequest getPullRequest(
            @PathVariable("owner") String owner,
            @PathVariable("repo") String repository,
            @PathVariable("pull_number") int pullNumber
    );

    // Note: https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#merge-a-pull-request
    @PutMapping("/repos/{owner}/{repo}/pulls/{pull_number}/merge")
    PullRequestMergeResult mergePullRequest(
            @PathVariable("owner") String owner,
            @PathVariable("repo") String repository,
            @PathVariable("pull_number") int pullNumber,
            PullRequestMergeRequest mergeRequest
    );
}
