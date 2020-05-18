<?php
$firstname = $_POST['firstname'];
$lastname = $_POST['lastname'];
$email = $_POST['email'];
$from = 'From: Coco's Personal Website'; 
$to = 'cocozhao321@gmail.com'; 
$subject = 'Request Information';
$body = "From: $name\n E-Mail: $email\n Message:\n $message";
if ($_POST['submit']) {
    if (mail ($to, $subject, $body, $from)) { 
        echo '<p>Your message has been sent!</p>';
    } else { 
        echo '<p>Something went wrong, go back and try again!</p>'; 
    }
}
?>
