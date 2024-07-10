package cholog.discord.command;

import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

import static java.util.stream.Collectors.toMap;

@Component
public final class SlashCommandListenerMapper extends ListenerAdapter {

    private static final Logger log = LoggerFactory.getLogger(SlashCommandListenerMapper.class);

    private final Map<String, SlashCommand> slashCommands;

    public SlashCommandListenerMapper(final List<SlashCommand> slashCommands) {
        this.slashCommands = slashCommands.stream()
                .collect(toMap(SlashCommand::commandName, command -> command));
    }

    @Override
    public void onSlashCommandInteraction(@NonNull final SlashCommandInteractionEvent event) {
        final var commandName = event.getName();
        final var slashCommand = slashCommands.get(commandName);
        if (slashCommand == null) {
            log.error("Slash command not found: {}", commandName);
            return;
        }
        slashCommand.onEvent(event);
    }
}
