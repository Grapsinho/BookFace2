from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys
from users.models import UserMedia

def optimize_image(image):
    # Open the uploaded image
    img = Image.open(image)

    # Resize or compress the image while keeping the aspect ratio
    max_size = (800, 800)  # Define the max dimensions
    img.thumbnail(max_size, Image.Resampling.LANCZOS)  # Maintain aspect ratio, use LANCZOS resampling for better quality

    # Save the optimized image to a BytesIO object
    buffer = BytesIO()

    # Check if the image is JPEG or PNG, adjust format and quality accordingly
    if img.format.lower() in ['jpeg', 'jpg']:
        img.save(buffer, format='JPEG', quality=80)  # Compress JPEG to 80% quality
    else:
        img.save(buffer, format=img.format)  # For other formats, use default quality

    buffer.seek(0)  # Move to the beginning of the buffer

    # Create a new InMemoryUploadedFile with the optimized image
    optimized_image = InMemoryUploadedFile(
        buffer,                     # File content
        'ImageField',               # Field type
        image.name,                 # File name
        f'image/{img.format.lower()}',  # Content type (MIME)
        sys.getsizeof(buffer),      # File size
        None                        # Optional charset
    )

    return optimized_image

def create_or_update_media(user, image_field, media_type):
    if image_field:
        media_path = image_field.url
        if not UserMedia.objects.filter(user=user, media_file_link=media_path, media_type=media_type).exists():
            UserMedia.objects.create(
                user=user,
                media_file_link=media_path,
                media_type=media_type,
            )