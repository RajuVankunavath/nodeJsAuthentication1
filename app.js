const express=require('express')
const path=require('path')
const {open}=require('sqlite')
const sqlite3=require('sqlite3') 
const bcrypt=require('bcrypt') 

const app=express() 
app.use(express.json())
const dbPath= path.join(__dirname,"userData.db")

let db=null
const initializationDbAndServer=async()=>{
 try {
     db= await open({
         filename:dbPath,
         driver:sqlite3.Database
     })

     app.listen(3000,()=>{
         console.log('Server Running at http://localhost:3000/ ')
     })
 } catch (error) {
     console.log(`DB Error ${error.message}`)
     process.exit(1)
 }
}

initializationDbAndServer() 




app.post('/register/',async(request,response)=>{
    const {name,username,password,location,gender}=request.body 
    const hashedPassword= await bcrypt.hash(password,10)
    const selectUserQuery=
    `SELECT 
    * 
    FROM user 

    WHERE username= '${username}'
    ;`
    const dbUser= await db.get(selectUserQuery) 

    if (dbUser===undefined){
        // createUser
        const creatUser=`
        INSERT INTO
        user(username,name,password,location,gender)
        VALUES(
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${location}',
            '${gender}'
        );` 
    if (password.length<5){
        response.status(400)
        response.send('Password is too short')
    }else{

        await db.run(creatUser)
        response.send('User created successfully')
    }

    }else{
        response.status(400)
        response.send('User already exists')
    }

})


// login API 

app.post('/login/',async(request,response)=>{
    const{username,password}=request.body 
    const userQuery=
   ` SELECT
    *
    FROM user 
    WHERE username='${username}';` 
    const dbUser = await db.get(userQuery)
    if (dbUser===undefined){
        response.status(400)
        response.send('Invalid user') 

    }else{
        const isPasswordMatched = await bcrypt.compare(password,dbUser.password) 
        if(isPasswordMatched===true){
            response.send('Login success!')
        }else{
            response.status(400)
            response.send("Invalid password") 
        }
    }
})


app.put('/change-password/',async(request,response)=>{
const {username,oldPassword,newPassword}=request.body
const checkUserQuery=`
SELECT 
*
FROM user 
WHERE username='${username}';`
const dbUser = await db.get(checkUserQuery) 
if (dbUser===undefined){
    response.status(400)
    response.send("User not register")
}else{
    const isValidPassword = await bcrypt.compare(oldPassword,dbUser.password) 
    if(isValidPassword===true){
        const lengthOfPassword= newPassword.length 
        if (lengthOfPassword<5){
            response.status(400)
            response.send("Password is too short")

        }else{
            const encryptedPassword = await bcrypt.hash(newPassword,10) 
            const updatePasswordQuery=`
            update user 
            set password='${encryptedPassword}'
            where username='${username}' 
            ;`
            await db.run(updatePasswordQuery)
            response.send('Password updated')
        }
    }else{
        response.status(400)
        response.send("Invalid current password")
    }
}

})



module.exports=app;