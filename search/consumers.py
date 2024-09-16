import json
from users.models import User
from channels.generic.websocket import WebsocketConsumer

class SearchConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        data = json.loads(text_data)
        query = data.get('query', '').strip()
        current_user_id = data.get('user_id', 1)

        # Perform the search with case-insensitive matching
        users = User.objects.filter(
            new_username__icontains=query,
        ).exclude(
            id=current_user_id  # Exclude the current user based on their ID
        ).values('first_name', 'last_name', 'email', 'avatar')[:10]

        # Send the results back
        self.send(text_data=json.dumps({
            'results': list(users)
        }))