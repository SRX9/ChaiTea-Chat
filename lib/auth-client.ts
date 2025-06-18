import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const signInWithGithub = () => {
  return authClient.signIn.social({
    provider: "github",
    callbackURL: "/",
  });
};

export const signInWithGoogle = () => {
  return authClient.signIn.social({
    provider: "google",
    callbackURL: "/",
  });
};

export const signOut = () => {
  return authClient.signOut();
};

export const useUser = () => {
  const { data: session, isPending } = authClient.useSession();

  return {
    user: session?.user,
    isLoggedIn: !!session?.user,
    isLoading: isPending,
  };
};
