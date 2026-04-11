import { Navigate } from 'react-router-dom'

const Index = () => {
  // Redirecionar para a home
  return <Navigate to="/home" replace />
}

export default Index