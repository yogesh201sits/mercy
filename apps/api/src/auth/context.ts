import type {
  ApiKeyAuth,
} from "./api-key-middleware";

import type {
  AuthUser,
} from "./middleware";

export interface MercyVariables {
  authUser: AuthUser;
  apiKeyAuth: ApiKeyAuth;
}

export interface MercyEnv {
  Variables: MercyVariables;
}