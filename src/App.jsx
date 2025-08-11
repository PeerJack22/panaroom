import { BrowserRouter, Route, Routes } from 'react-router'
import { Home } from './pages/Home'
import Login from './pages/Login'
import { Register } from './pages/Register'
import { Forgot } from './pages/Forgot'
import { Confirm } from './pages/Confirm'
import { NotFound } from './pages/NotFound'
import AuthSuccess from './pages/AuthSuccess'
import Dashboard from './layout/Dashboard'
import Profile from './pages/Profile'
import List from './pages/List'
import Details from './pages/Details'
import Create from './pages/Create'
import Update from './pages/Update'
import Chat from './pages/Chat'
import Reset from './pages/Reset'
import Users from './pages/Users'
import PublicRoute from './routes/PublicRoute'
import ProtectedRoute from './routes/ProtectedRoute'
import { useEffect } from 'react'
import storeProfile from './context/storeProfile'
import storeAuth from './context/storeAuth'
import PrivateRouteWithRole from './routes/PrivateRouteWithRole';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {

  const { profile} = storeProfile()
  const { token } = storeAuth()

  useEffect(() => {
    if(token){
      profile()
    }
  }, [token, profile])

  return (
    <>
    <BrowserRouter>
      <Routes>
        
        <Route element={<PublicRoute />}>
          <Route index element={<Home/>}/>
          <Route path='login' element={<Login/>}/>
          <Route path='register' element={<Register/>}/>
          <Route path='forgot/:id' element={<Forgot/>}/>
          <Route path='confirm/:token' element={<Confirm/>}/>
          <Route path='reset/:token' element={<Reset/>}/>
          <Route path='auth/success' element={<AuthSuccess />} />
          <Route path='*' element={<NotFound />} />
        </Route>


          <Route path='dashboard/*' element={
            <ProtectedRoute>
              <Routes>
                <Route element={<Dashboard />}>
                  <Route index element={<Profile />} />
                  <Route path='listar' element={<List />} />
                  <Route path='visualizar/:id' element={<Details />} />
                  <Route path='crear' element={<Create />} />
                  <Route path='actualizar/:id' element={<Update />} />
                  <Route path='chat' element={<Chat />} />
                  <Route path='usuarios' element={
                    <PrivateRouteWithRole>
                    <Users/>
                    </PrivateRouteWithRole>
                    } />
                </Route>
              </Routes>
            </ProtectedRoute>
          } />


      </Routes>
    </BrowserRouter>
    
    {/* ToastContainer único para toda la aplicación */}
    <ToastContainer 
      position="bottom-right" 
      theme="dark"
      limit={3} 
      newestOnTop={true} 
      autoClose={3000}
    />
    </>
  )
}

export default App