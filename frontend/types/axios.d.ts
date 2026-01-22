import "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    loadingKey?: string;
    skipLoading?: boolean;
    __loadingKey?: string;
  }
}
