import { FiresideUser, userQueryOptions } from "@/lib/useUserQuery";
import { persister } from "@/query";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const getUser = async ({ queryClient }: { queryClient: QueryClient }) => {
  await persister.restoreClient();
  return queryClient.getQueryData<FiresideUser>(userQueryOptions.queryKey);
};
export const ReactiveAuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const user = useQueryClient().getQueryData<FiresideUser>(
    userQueryOptions.queryKey
  );

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate({ to: "/" });
    }
  }, [user]);

  return <>{children}</>;
};