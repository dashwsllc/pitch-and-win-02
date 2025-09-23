import { Navigate } from 'react-router-dom'

const Index = () => {
  // Redirecionar para o dashboard individual
  return <Navigate to="/dashboard" replace />
}

export default Index