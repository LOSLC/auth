import { getCurrentUser } from "@/app/actions/authtentication";
import { useQuery } from "@tanstack/react-query";

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["auth", "currentUser"],
    queryFn: getCurrentUser,
    throwOnError: true,
  });
};
