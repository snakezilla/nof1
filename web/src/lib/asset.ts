/** A public file's URL under the site base (vite.config.ts `base`), e.g. asset("media/x.mp4"). */
export const asset = (path: string): string =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
