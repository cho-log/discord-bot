package cholog.discord.message;

import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

import static java.util.stream.Collectors.toMap;

@Component
public final class MergeSubscriptionMapper extends ListenerAdapter {

    private static final Logger log = LoggerFactory.getLogger(MergeSubscriptionMapper.class);

    private final Map<String, MessageSubscription> messageSubscriptions;

    MergeSubscriptionMapper(final List<MessageSubscription> messageSubscriptions) {
        this.messageSubscriptions = messageSubscriptions.stream()
                .collect(toMap(MessageSubscription::channelId, command -> command));
    }

    @Override
    public void onMessageReceived(@NonNull final MessageReceivedEvent event) {
        if (event.getAuthor().isBot()) {
            log.debug("Bot message");
            return;
        }

        final var channelId = event.getChannel().getId();
        final var messageSubscription = messageSubscriptions.get(channelId);
        if (messageSubscription == null) {
            log.debug("Message subscription not found [channelId={}, message={}]", channelId, event.getMessage());
            return;
        }
        messageSubscription.onEvent(event);
    }
}
