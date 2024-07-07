package cholog.discord.command;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "cholog.jda.commands")
public record CommandsProperties(
        PrMergeProperties prMerge
) {

    public String prMergeChannelId() {
        return prMerge.channelId();
    }

    public boolean isDisallowOrganization(final String organization) {
        return !prMerge.allowOrganizations().contains(organization);
    }

    public boolean isDisallowRepository(final String repository) {
        return !prMerge.allowRepositories().contains(repository);
    }

    public boolean isDisallowBranch(final String branch) {
        return prMerge.disallowBranches().contains(branch);
    }

    public record PrMergeProperties(
            String channelId,
            List<String> allowOrganizations,
            List<String> allowRepositories,
            List<String> disallowBranches
    ) {

    }
}
