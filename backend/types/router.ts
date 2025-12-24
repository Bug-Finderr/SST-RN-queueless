export type Params = { [key: string]: string };

export type Handler = (req: Request, p: Params) => Response | Promise<Response>;
