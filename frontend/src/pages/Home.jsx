import { useUserContext } from "@/hooks/useUserContext"


const Home = () => {
  const { user } = useUserContext();

  return (
    <div>Home Page: {user && user.username}</div>
  )
}

export default Home
