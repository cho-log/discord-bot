package cholog.discord.message;

import net.dv8tion.jda.api.events.message.MessageReceivedEvent;

public interface MessageSubscription {

    String channelId();

    void onEvent(MessageReceivedEvent event);
}
