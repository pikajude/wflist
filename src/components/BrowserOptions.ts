import * as z from "zod";

export const BrowserOptions = z
  .object({
    showImages: z.boolean().default(true),
    hideCrafted: z.boolean().default(true),
    hideVaulted: z.boolean().default(true),
    useInvasions: z.boolean().default(true),
    modular: z
      .object({
        ampBrace: z.string().default(""),
        ampScaffold: z.string().default(""),
        gunGrip: z.string().default(""),
        boardNose: z.string().default(""),
        boardJet: z.string().default(""),
        boardReactor: z.string().default(""),
        gunLoader: z.string().default(""),
        zawGrip: z.string().default(""),
        zawLink: z.string().default(""),
      })
      .prefault({}),
  })
  .prefault({});

export type BrowserOptions = z.output<typeof BrowserOptions>;
