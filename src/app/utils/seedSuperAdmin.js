
import bcryptJs from 'bcryptjs'
import { User } from "../modules/auth/auth.model"
import { envVars } from '../config/env'

export const seedSuperAdmin = async () => {
    try{
        const isSuperAdminExist = await User.findOne({email: envVars.SUPER_ADMIN_EMAIL})

        if(isSuperAdminExist){
            console.log('Super Admin already exist')
            return
        }

        console.log("Super Admin is being created now....")
        const hashedPassword = await bcryptJs.hash(envVars.SUPER_ADMIN_PASSWORD, Number(envVars.BCRYPT_SALT_ROUND))


        const payload = {
            name: "Super Admin",
            role: Role.SUPER_ADMIN,
            email: envVars.SUPER_ADMIN_EMAIL,
            password: hashedPassword,
        }

        const superAdmin = await User.create(payload)
        console.log("Super Admin is created successfully\n")
        console.log(superAdmin)
    }catch(err){
        console.log(err)
    }
}