import { sendExtensionMessage } from "../messaging/bridgeClient";
import { MESSAGE_TYPES } from "../messaging/messageTypes";

export const fetchAuthStatus = async () => {
  try {
    const response = await sendExtensionMessage(MESSAGE_TYPES.CHECK_AUTH_STATUS);
    return {
      authenticated: Boolean(response?.authenticated),
      user: response?.user ?? null,
      subscribed: Boolean(response?.subscribed),
      proSubscription: response?.proSubscription ?? null,
      hasSubscribedBefore: Boolean(response?.hasSubscribedBefore),
      cached: Boolean(response?.cached),
    };
  } catch (error) {
    return {
      authenticated: false,
      user: null,
      subscribed: false,
      proSubscription: null,
      hasSubscribedBefore: false,
      cached: false,
      error: error?.message || "Failed to fetch auth status",
    };
  }
};
