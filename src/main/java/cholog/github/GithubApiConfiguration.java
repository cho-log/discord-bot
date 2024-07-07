package cholog.github;

import feign.RequestInterceptor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@EnableConfigurationProperties(GithubProperties.class)
@EnableFeignClients(clients = GithubApi.class)
@Configuration
class GithubApiConfiguration {

    private final GithubProperties githubProperties;

    GithubApiConfiguration(final GithubProperties githubProperties) {
        this.githubProperties = githubProperties;
    }

    @Bean("githubApiRequestInterceptor")
    RequestInterceptor githubApiRequestInterceptor() {
        return requestTemplate -> {
            requestTemplate.header("Content-Type", "application/json");
            requestTemplate.header("Accept", "application/vnd.github.+json");
            requestTemplate.header("Authorization", "token " + githubProperties.token());
            requestTemplate.header("X-Github-Api-Version", githubProperties.apiVersion());
        };
    }
}
