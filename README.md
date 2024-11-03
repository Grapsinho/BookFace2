# Social Media Platform

This is a social media platform built with Django, offering features like user registration, profile management, posts, friend requests, notifications, and messaging. The platform includes optimized functionalities for seamless user experience and performance.

## Features

### User Authentication

- **Login & Registration:** User authentication through a secure login and registration process using JWT token.
- **Password Change:** Ability for users to change their password.
- **Profile Setup:** Customizable user profiles with image support (profile and background images).

### Friend Management

- **Search Users:** Users can search for others on the platform.
- **Friend Requests:** Users can send, accept, and reject friend requests, each action generating notifications.
- **Friend Deletion:** Users can remove friends, and related notifications will be deleted.
- **Friend List Optimization:** Profiles display an optimized friend list.

### Posts and Media

- **Create Posts:** Users can create posts with either an image or video, along with descriptions and tags.
- **Media Handling:** Image and video uploads are validated and optimized for efficient loading.
- **Likes & Comments:** Users can like and comment on posts, triggering notifications for the post owner.
- **Post Editing & Deletion:** Users can edit or delete their posts.
- **Post Sharing:** Posts can be shared, including shared posts with likes and comments.

### Comments and Tag Management

- **Comment Features:** Users can write, edit, and delete comments on posts.
- **Tag Management:** Tags can be added to posts, and users can modify their tags.

### Messaging System

- **Chat Requests:** Users can send a chat request when they want to message a new friend.
- **Message Deletion:** Users can delete messages within a conversation.
- **Notifications for Messages:** Notifications are sent for incoming messages.

### Notifications System

- **Event-based Notifications:** Notifications are generated for friend requests, post interactions (likes/comments), and messages.
- **Real-time Support with Celery:** Tasks like notifications are handled asynchronously with Celery for better performance.

### "For You" Feed

- **Personalized Feed:** Each user has a “For You” page displaying relevant posts from their friends, based on tags and popular posts.
- **Pagination:** Infinite scroll-based pagination for loading more posts on profiles and the "For You" feed.

## Technologies Used

- **Backend:** Django, Django REST Framework
- **Database:** PostgreSQL
- **Frontend:** HTML, CSS, JavaScript, Bootstrap, AJAX & jQuery
- **Real-time Communication:** Django Channels, WebSockets
- **Asynchronous Task Queue:** Celery
- **Caching, Message Broker:** Redis

## Installation

1. Clone the repository:

```bash
git clone [repository URL]
```

2. Navigate to the project directory:

```bash
cd [repository name]
```

3. Create a virtual environment:

```bash
python3 -m venv venv
```

4. Activate the virtual environment:

- On macOS and Linux:

```bash
source venv/bin/activate
```

- On Windows:

```bash
venv\Scripts\activate
```

5. Install the dependencies:

```bash
pip install -r requirements.txt
```

6. Run migrations:

```bash
python manage.py migrate
```

7. Start the development server:

```bash
python manage.py runserver
```

8. Don't forget to run celery and redis server:

```bash
redis server
```

```bash
celery -A core worker --loglevel=info --pool=solo
```

9. Access the application at `http://localhost:8000` in your web browser.

## Contact

For questions or feedback, please contact giguuag@gmail.com.
