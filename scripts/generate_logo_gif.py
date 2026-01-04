
import os
from PIL import Image, ImageEnhance, ImageDraw

def create_breathing_logo():
    input_path = 'public/icon-192.png'
    output_path = 'public/logo-animation.gif'

    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        return

    # Load image
    original = Image.open(input_path).convert("RGBA")
    
    # Create frames
    frames = []
    num_frames = 20
    
    # Animation: Pulse scale from 1.0 to 1.1 and back
    # And subtle opacity/brightness change
    
    for i in range(num_frames):
        # Calculate scale factor (sinusoidal-ish)
        # 0 -> 1 -> 0
        if i < num_frames / 2:
            progress = i / (num_frames / 2)
        else:
            progress = (num_frames - i) / (num_frames / 2)
            
        scale = 1.0 + (0.1 * progress) # 1.0 to 1.1
        
        # Resize
        new_size = (int(original.width * scale), int(original.height * scale))
        resized = original.resize(new_size, Image.Resampling.LANCZOS)
        
        # Create a new canvas of the max size to center the image
        max_size = (int(original.width * 1.15), int(original.height * 1.15))
        frame = Image.new("RGBA", max_size, (255, 255, 255, 0)) # Transparent background
        
        # Center position
        pos = ((max_size[0] - new_size[0]) // 2, (max_size[1] - new_size[1]) // 2)
        frame.paste(resized, pos, resized)
        
        frames.append(frame)

    # Save as GIF
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=100, # ms per frame
        loop=0,
        transparency=0,
        disposal=2
    )
    print(f"GIF saved to {output_path}")

if __name__ == "__main__":
    create_breathing_logo()
