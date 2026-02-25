export const BUILD_INFO = {
  sha: __APP_BUILD_SHA__,
  time: __APP_BUILD_TIME__,
  branch: __APP_BUILD_BRANCH__,
};

export const BUILD_SHA_SHORT = BUILD_INFO.sha === "local"
  ? "local"
  : BUILD_INFO.sha.slice(0, 7);
