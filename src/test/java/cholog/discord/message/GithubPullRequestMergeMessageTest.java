package cholog.discord.message;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;

class GithubPullRequestMergeMessageTest {

    @Test
    void extractUrls_lastComment() {
        final var message = new GithubPullRequestMergeMessage("""
                https://github.com/next-step/java-lotto-clean-playground/pull/35
                https://github.com/next-step/java-lotto-clean-playground/pull/37
                https://github.com/next-step/java-lotto-clean-playground/pull/39
                https://github.com/next-step/java-lotto-clean-playground/pull/40
                                
                머지 요청드립니다!""");

        final var extractUrls = message.extractUrls();

        assertAll(
                () -> assertThat(extractUrls).hasSize(4),
                () -> assertThat(extractUrls.getFirst().pullNumber()).isEqualTo(35),
                () -> assertThat(extractUrls.getLast().pullNumber()).isEqualTo(40)
        );
    }

    @Test
    void extractUrls_firstComment() {
        final var message = new GithubPullRequestMergeMessage("""
                머지요청드립니다 (자동차) :chologe:\s
                https://github.com/next-step/java-racingcar-simple-playground/pull/30
                https://github.com/next-step/java-racingcar-simple-playground/pull/44
                https://github.com/next-step/java-racingcar-simple-playground/pull/45
                https://github.com/next-step/java-racingcar-simple-playground/pull/46
                https://github.com/next-step/java-racingcar-simple-playground/pull/48
                https://github.com/next-step/java-racingcar-simple-playground/pull/49
                """);

        final var extractUrls = message.extractUrls();

        assertAll(
                () -> assertThat(extractUrls).hasSize(6),
                () -> assertThat(extractUrls.getFirst().pullNumber()).isEqualTo(30),
                () -> assertThat(extractUrls.getLast().pullNumber()).isEqualTo(49)
        );
    }
}
