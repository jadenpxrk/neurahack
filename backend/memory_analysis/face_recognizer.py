# use reference photos of everyone's face
# use openai vision api to get the faces in the frames
# compare the faces to the reference photos
# return the name of the person in the frame

import face_recognition
import os
import numpy as np
from typing import Dict, Optional


class FaceRecognizer:
    def __init__(self, faces_dir: str = "../faces"):
        self.known_face_encodings = []
        self.known_face_names = []
        self.load_reference_faces(faces_dir)

    def load_reference_faces(self, faces_dir: str) -> None:
        """Load reference faces from the faces directory."""
        for filename in os.listdir(faces_dir):
            if filename.endswith(".jpg"):
                # Get person name from filename (removing .jpg)
                person_name = filename[:-4]
                image_path = os.path.join(faces_dir, filename)

                # Load the image and get face encoding
                face_image = face_recognition.load_image_file(image_path)
                face_encodings = face_recognition.face_encodings(face_image)

                if face_encodings:
                    self.known_face_encodings.append(face_encodings[0])
                    self.known_face_names.append(person_name)

    def identify_face(self, frame) -> Optional[str]:
        """
        Identify a face in a given frame.
        Returns the name of the person if found, None otherwise.
        """
        # Find all faces in the frame
        face_locations = face_recognition.face_locations(frame)
        face_encodings = face_recognition.face_encodings(frame, face_locations)

        # If no faces found, return None
        if not face_encodings:
            return None

        # For each face found in the frame
        for face_encoding in face_encodings:
            # Compare with known faces
            matches = face_recognition.compare_faces(
                self.known_face_encodings, face_encoding, tolerance=0.6
            )

            if True in matches:
                # Get the index of the matched face
                match_index = matches.index(True)
                return self.known_face_names[match_index]

        return None

    def process_frame(self, frame) -> Dict[str, any]:
        """
        Process a frame and return face recognition results.
        Returns a dictionary with face information.
        """
        person_name = self.identify_face(frame)

        return {"person_detected": person_name is not None, "person_name": person_name}
