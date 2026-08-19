import crypto from 'crypto';

function hashPassword(password){
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto.scryptSync(password, salt, 64).toString('hex');
    return {
        salt: salt,
        hashedPassword: hashedPassword
    };
}

function verifyPassword(enteredPassword, salt, hashedPassword){
    const hashedEnteredPassword = crypto.scryptSync(enteredPassword, salt, 64);
    return crypto.timingSafeEqual(hashedEnteredPassword, Buffer.from(hashedPassword, 'hex')); // not using ===
}

export { hashPassword, verifyPassword };

/*

Lets take about password storing and verifications:
Usually backend do not stores passwords in plain text strings because can be exposed in a data breach.
So backend stores the password conceptually in a hashed format. Because hashes are one way and non-reversible.
So even if hashes are exposed then also it is not possible to get the original password from it.

Now it's not like we got password and convert it into hash and store it. Because 2 users can have same password leading to same hash stored with their user name and if
one is exposed then other user may be also affected. So to avoid that we use 'salt' concept.
Salt is nothing but a random string generated for each user.
So the simplified process looks like:
User created account with userName and password. And backend received both as text strings.
Now backend will generate a random salt for that user, convert that salt into hex string.
Then it will take "salt + password" as input and convert it into hash using special hashing algo called 'PBKDF'.
Now db will store [ username, salt, hash ] for that user. See there is no password stored in db.

So how verification happens when user tries to login:
Backend receives userName and password mostly as text strings.
Then backend will fetch the "salt and hash" stored for that username.
It will run the same hashing algo with "salt + enteredPassword" and generate a hash.
if that generated hash is same as stored hash for that user then login is successful else failed.

Now lets see what methods we used.
To generate salt we used==> crypto.randomBytes(16); every time this method is called it will generate a random "buffer" of 16 bytes.
    and then we converted that buffer to hex string to store and use easily.
To generate hash/derivedKey ==> crypto.scryptSync(password, salt, 64); --> Order of args matters here. Can't do (salt, password, 64)
    It is taking entered (password & salt) as input and generating hash/derivedKey of 64 bytes. We can choose any length instead of 64 but it should be same while storing and verifying.
    This is not a regular hashing algo like sha-256 or md5. This is called 'PBKDF' (Password based key derivation function) ago. This is designed to be slow and cpu heavy and memory expensive so that
    attacker can't do brute force like sending millions of guessed passwords in a second.
    But what we used 'scryptSync() is synchronous version of scrypt() means it will block the thread until it is done. so if server is receiving concurrent requests then others will wait.
To compare generated and stored hash/keys  => timingSafeEqual();  --> this method takes only buffers as input and also length of both buffers must be same.
    why not using === operator? Because lets say while comparing 2 buffers if first byte is different then it will return false immediately which leaks time taken info and attackers can guess this.
    But timingSafeEqual() takes same time to respond every time.


Encoding: Converting data from one representation to another like text -> bytes, bytes -> text etc.
There are many type of encodings present like UTF-8, UTF-16, hex, base64..
At the end what node server receives is raw bits like (10101010 11110011 ....).
And node stores them as buffer. Buffer is kind of a container which stores raw bytes.
Also node represent those bytes in hexadecimal format. If you try to print that buffer than conceptually we will see: <Buffer 68 65 6c 6c 6f>.
if you try to understand it then lets take '6c' which is in binary is 01101100. So node received 01101100 and stored as buffer and represents in hexadecimal form '6c' because it is more readable.

Lets say this buffer node have: 68 65 6c 6c 6f  <--- which is just hexadecimal representation of raw bits.
we can convert it into text string as:
buffer.toString("UTF-8"); // "hello"
covert it into 'hex' string:
buffer.toString("hex"); // "68656c6c6f"  ==> Notice this looks similar to our buffer in hex format: 68 65 6c 6c 6f but this is not string, this is actual bytes in Buffer and node chose to display them in hex format but here we are converting those bytes into string in it's hex format.
convert it into 'base64' string:
buffer.toString("base64"); // "aGVsbG8="  ==> this is base64 texual representation of 'hello'

Now lets say if we have to convert those strings into bytes again.
Buffer.from("hello", "UTF-8"); // <Buffer 68 65 6c 6c 6f>.
Buffer.from("hello", "hex"); // ERROR because "hello" is not a valid hex string, hex string format can contain only 0-9 & a-f
    Buffer.from("68656c6c6f", "hex"); // now it will convert into <Buffer 68 65 6c 6c 6f>.
Buffer.from("hello", "base64"); // ERROR because "hello" is not valid base64 string.
    Buffer.from("aGVsbG8="); //  <Buffer 68 65 6c 6c 6f>.

NOTE: encodings like 'utf-8', 'utf-16', 'base64'.. these are just another representation and does not mean data becoming encypted.
These are 2-way reversible methods.
    Lets say I have a string "hello". I converted it into base64 string as Buffer.from("hello", "UTF-8").toString("base64");
    (1st we are converting "hello" into buffer )
    Now i got base64 encoded string "aGVsbG8=" for "hello". But this base64 can be easily converted into original string "hello" as:
    Buffer.from("aGVsbG8=", "base64").toString("UTF-8"); ==> "hello".


Hashing: Converting data into fixed sized bytes using hashing alogorithms like sha-256. The resulting fixed sized bytes are called 'hash' or 'digest'. This 'hash' or 'digest' is non reversable.
Meaning from a hash conceptually it is not possible to interpret the same input data.
Hashing gives same result everytime for same input.

Note: These hash are bytes and we often encode them to store and use them as strings. Like:
If we do:
crypto.createHash("sha-256").update("hello").digest();
Here we converted "hello" into hash if we print it ==> <Buffer 2c f2 4d ba 5f b0 a3 0e ...>
But if we do : crypto.createHash("sha-256").update("hello").digest("hex");
    Now the o/p will be: "2cf24dba5fb0a30e..." which can be stored and used easily.

*/