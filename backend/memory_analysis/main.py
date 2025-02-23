from openai import OpenAI
import dotenv
from google import genai
import os
import base64
import cv2
from face_recognition import FaceRecognizer
import json

dotenv.load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize face recognizer
face_recognizer = FaceRecognizer()

# basically create a question from a video transcript and frames of the video
# we give fraems to gpt vision to analyze
# it also makes answers for the question given the transcript and frames
# the question should test the user's recall of the memory
# should be an mcq or short answer question
# something to analyze videos


def create_question_and_answer(video_path: str):
    # feed in the description of what's happening based on the frames of the video
    # and the audio transcript of the video to gemini api
    # get back a question and answer

    audio_transcript = get_audio_transcript(video_path)
    video_description = get_video_description(video_path)

    prompt = f"""
    You are a making a QNA for someone with memory loss. You are given a video transcript and a description of the video.
    You need to create a question and answer based on the transcript and description.
    The question should test the user's recall of the memory.
    If the question is a who question, the answer should be one of the people in the person's life.
    The people are Raymond, Lindsay, Jeong, and Ian.
    Otherwise, the question should be a short answer question.
    
    The audio transcript is: {audio_transcript}
    The video description described by an AI vision model is: {video_description}
    The way the AI vision model analyzes the video is by looking at some of the frames of the video every second.
    """

    # use gemini api to generate the question and answer
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)

    # return response.text
    # save it to a json file qna.json in the backend folder
    with open("qna.json", "w") as f:
        json.dump(response.text, f)


def get_audio_transcript(video_path: str):
    # get the audio transcript of the video
    audio_file = open(f"{video_path}", "rb")
    transcription = client.audio.transcriptions.create(
        model="whisper-1", file=audio_file
    )

    return transcription.text


def get_frames(video_path: str, video_name: str):
    # get the frames of the video
    # use openai vision api to get the frames

    # take a screenshot of the video every second
    # store locally in a folder
    # return the folder path of where the frames are saved

    # get the frames of the video
    frames = []
    cap = cv2.VideoCapture(video_path)
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)

    # save frames as images in a folder called frames
    # return the folder path
    os.makedirs(f"vids/{video_name}/frames", exist_ok=True)
    for i, frame in enumerate(frames):
        cv2.imwrite(f"vids/{video_name}/frames/frame_{i}.jpg", frame)

    # return the folder path
    return "frames"


def encode_image(image_path: str):
    # encode the image
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def get_video_description(video_path: str):
    # get the description of the video
    # use openai vision api to get the description
    # feed in the frames of the video to the vision api
    # get back a description of the video

    # get the frames of the video
    frames_path = get_frames(video_path)
    descriptions = []

    # Process each frame for both visual content and face recognition
    for frame_file in os.listdir(frames_path):
        if not frame_file.endswith(".jpg"):
            continue

        frame_path = os.path.join(frames_path, frame_file)
        frame = cv2.imread(frame_path)

        # Get face recognition results
        face_results = face_recognizer.process_frame(frame)
        person_context = ""
        if face_results["person_detected"]:
            person_context = f"The person in this frame appears to be {face_results['person_name']}. "

        encoded_image = encode_image(frame_path)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"Describe what's happening in this image. {person_context}Focus on the actions, emotions, and setting.",
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{encoded_image}",
                            },
                        },
                    ],
                }
            ],
            max_tokens=300,
        )
        descriptions.append(response.choices[0].message.content)

    # Combine all descriptions into a coherent narrative
    combined_description = " ".join(descriptions)
    return combined_description


def main():
    try:
        video_path = "vids/raw/lottery.mp4"  # Note: Changed .py to .mp4 as it should be a video file
        print("Processing video:", video_path)

        question_and_answer = create_question_and_answer(video_path)
        print("\nGenerated Question and Answer:")
        print(question_and_answer)

    except Exception as e:
        print(f"An error occurred while processing the video: {str(e)}")


if __name__ == "__main__":
    main()
