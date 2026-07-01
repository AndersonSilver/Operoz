import { action, observable, runInAction, makeObservable } from "mobx";
// plane internal packages
import type { TUserStatus } from "@operoz/constants";
import { EUserStatus } from "@operoz/constants";
import { AuthService, UserService } from "@operoz/services";
import type { IUser } from "@operoz/types";
// root store
import type { RootStore } from "@/store/root.store";

export interface IUserStore {
  // observables
  isLoading: boolean;
  userStatus: TUserStatus | undefined;
  isUserLoggedIn: boolean | undefined;
  currentUser: IUser | undefined;
  // fetch actions
  hydrate: (data: any) => void;
  fetchCurrentUser: () => Promise<IUser>;
  reset: () => void;
  signOut: () => void;
}

export class UserStore implements IUserStore {
  // observables
  isLoading: boolean = true;
  userStatus: TUserStatus | undefined = undefined;
  isUserLoggedIn: boolean | undefined = undefined;
  currentUser: IUser | undefined = undefined;
  // services
  userService;
  authService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      isLoading: observable.ref,
      userStatus: observable,
      isUserLoggedIn: observable.ref,
      currentUser: observable,
      // action
      fetchCurrentUser: action,
      reset: action,
      signOut: action,
    });
    this.userService = new UserService();
    this.authService = new AuthService();
  }

  hydrate = (data: any) => {
    if (data) this.currentUser = data;
  };

  /**
   * @description Fetches the current user
   * @returns Promise<IUser>
   */
  fetchCurrentUser = async () => {
    try {
      if (this.currentUser === undefined) this.isLoading = true;
      const currentUser = await this.userService.adminDetails();
      if (currentUser) {
        await this.store.instance.fetchInstanceAdmins();
        runInAction(() => {
          this.isUserLoggedIn = true;
          this.currentUser = currentUser;
          this.isLoading = false;
        });
      } else {
        runInAction(() => {
          this.isUserLoggedIn = false;
          this.currentUser = undefined;
          this.isLoading = false;
        });
      }
      return currentUser;
    } catch (error: any) {
      // Stay inside runInAction: async boundaries leave MobX actions after the first `await`.
      runInAction(() => {
        this.isLoading = false;
        this.isUserLoggedIn = false;
        const status = error?.status ?? error?.status_code;
        if (status === 403)
          this.userStatus = {
            status: EUserStatus.AUTHENTICATION_NOT_DONE,
            message: error?.message || "",
          };
        else
          this.userStatus = {
            status: EUserStatus.ERROR,
            message: typeof error?.detail === "string" ? error.detail : error?.message || "",
          };
      });
      return undefined;
    }
  };

  reset = async () => {
    this.isUserLoggedIn = false;
    this.currentUser = undefined;
    this.isLoading = false;
    this.userStatus = undefined;
  };

  signOut = async () => {
    this.store.resetOnSignOut();
  };
}
