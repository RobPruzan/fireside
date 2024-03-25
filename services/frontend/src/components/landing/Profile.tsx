import { useDefinedUser } from "../camps/camps-state";

export const Profile = () => {
  const user = useDefinedUser();

  return (
    <div className="flex flex-col min-h-calc w-screen items-center justify-start p-10">
      Email:{user.email}
    </div>
  );
};
