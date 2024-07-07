package cholog.discord;

import jakarta.annotation.PostConstruct;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.interactions.commands.build.Commands;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public final class SlashCommandRegistry {

    private static final Logger log = LoggerFactory.getLogger(SlashCommandRegistry.class);

    private final Guild guild;

    private final List<SlashCommand> slashCommands;

    SlashCommandRegistry(
            final Guild guild,
            final List<SlashCommand> slashCommands
    ) {
        this.guild = guild;
        this.slashCommands = slashCommands;
    }

    @PostConstruct
    void setUpCommands() {
        if (slashCommands.isEmpty()) {
            log.warn("No commands");
            return;
        }

        log.info("Registering [{}] commands", slashCommands.stream().map(SlashCommand::commandName).toList());

        final var listOfSlashCommandData = slashCommands.stream()
                .map(listener -> Commands.slash(listener.commandName(), listener.description()).addOptions(listener.options()))
                .toList();
        guild.updateCommands().addCommands(listOfSlashCommandData).queue();
        log.info("Commands are registered");
    }
}
