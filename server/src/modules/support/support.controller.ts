import type { NextFunction, Request, Response } from "express";

import { runSupportChat } from "./support.service.js";

export async function supportChatHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as { messages?: unknown };
    const result = await runSupportChat(body?.messages);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
