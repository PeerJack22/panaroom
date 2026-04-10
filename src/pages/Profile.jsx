
import CardPassword from '../components/profile/CardPassword'
import { CardProfile } from '../components/profile/CardProfile'
import FormProfile from '../components/profile/FormProfile'


const Profile = () => {
    return (
        <>       
            <div>
                <h1 className='font-black text-4xl text-gray-500'>Perfil</h1>
                <hr className='x'/>
                <p className='mb-8'>Este módulo te permite gestionar el perfil del usuario</p>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-start'>
                <div className='w-full'>
                    <FormProfile/>
                </div>
                <div className='w-full'>
                    <CardProfile/>
                    <CardPassword/>
                </div>
            </div>
        </>

    )
}

export default Profile