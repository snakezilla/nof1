import { createContext } from "react";

/** True inside the part of the page drawn from masked rows; figure kickers then say so. */
export const MaskedContext = createContext(false);

export const MASKED_PREFIX = "Masked data.";

export const maskedKicker = (kicker: string, masked: boolean): string =>
  masked ? `${MASKED_PREFIX} ${kicker}` : kicker;
