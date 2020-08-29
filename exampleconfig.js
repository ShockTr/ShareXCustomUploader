module.exports = {
    mongodb_uri : "",
    mode : "dev",
    length : 8, // Length of the id if you cant choose there is a simple tool for you : https://zelark.github.io/nano-id-cc/
    secret : "secret", // The Secret secret key for uploading safely
    base_uri: "http://localhost:3000/", // Your Domain and path that uploader is located at
    image_directory: "i",
    redirect_uri : "http://borakayik.com/",// redirect for browser users
    errorMessage : {
        invalidSecret : "Hatalı Secret",
        noSecret : "Secret Gir",
        cannotWrite : "707 Yazma başarısız", // TODO: Error handler for 707 errors
        LIMIT_FILE_SIZE: 'File too large',
        LIMIT_FILE_COUNT: 'Too many files',
        noFile: "Please upload a file"
    },
    "allowed_ips" : [] //allowed ips for panel
}
