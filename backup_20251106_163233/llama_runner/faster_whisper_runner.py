import logging
import os
from typing import Optional, Dict, Any, Union, List

from faster_whisper import WhisperModel
from fastapi import UploadFile


class FasterWhisperRunner:
    """
    Manage speech-to-text transcription using faster-whisper.
    This implementation replaces whisper.cpp with a pure Python solution
    that can be installed via pip and doesn't require compilation.
    """

    def __init__(self, audio_config: Dict[str, Any], model_name: str):
        """
        Initialize the faster-whisper runner with audio configuration and model name.

        :param audio_config: audio config (normalized)
        :param model_name: model name from audio_config['models']
        """
        self.audio_config = audio_config
        self.model_name = model_name

        # Get model and runtime config
        models = audio_config.get('models', {})
        model_conf = models.get(model_name, {})

        self.model_path = model_conf.get("model_path")
        self.parameters = model_conf.get("parameters", {})

        if not self.model_path:
            raise ValueError(f"Model path for '{self.model_name}' not defined in audio config.")

        # Initialize the faster-whisper model
        try:
            # faster-whisper can automatically download models if model_path is just a model name
            # or load from a local path
            model_size_or_path = self.model_path
            
            # Extract parameters
            device = self.parameters.get("device", "cpu")
            compute_type = self.parameters.get("compute_type", "int8")
            cpu_threads = self.parameters.get("threads", 4)
            
            logging.info(f"Loading faster-whisper model: {model_size_or_path} on {device}")
            self.model = WhisperModel(
                model_size_or_path,
                device=device,
                compute_type=compute_type,
                cpu_threads=cpu_threads
            )
            logging.info(f"Successfully loaded faster-whisper model: {model_size_or_path}")
            
        except Exception as e:
            logging.error(f"Failed to load faster-whisper model {model_size_or_path}: {e}")
            raise

    def transcribe_audio(self, audio_path: str, task: str = "transcribe") -> Union[Dict[str, Any], None]:
        """
        Transcribe or translate audio using faster-whisper.
        
        :param audio_path: Path to audio file
        :param task: "transcribe" or "translate"
        :return: Transcription result as dictionary
        """
        try:
            # Extract parameters for transcription
            language = self.parameters.get("language", None)  # None means auto-detect
            beam_size = self.parameters.get("beam_size", 5)
            best_of = self.parameters.get("best_of", 5)
            patience = self.parameters.get("patience", 1.0)
            length_penalty = self.parameters.get("length_penalty", 1.0)
            temperature = self.parameters.get("temperature", 0.0)
            compression_ratio_threshold = self.parameters.get("compression_ratio_threshold", 2.4)
            log_prob_threshold = self.parameters.get("log_prob_threshold", -1.0)
            no_speech_threshold = self.parameters.get("no_speech_threshold", 0.6)
            condition_on_previous_text = self.parameters.get("condition_on_previous_text", True)
            
            # Perform transcription/translation
            segments, info = self.model.transcribe(
                audio_path,
                task=task,
                language=language,
                beam_size=beam_size,
                best_of=best_of,
                patience=patience,
                length_penalty=length_penalty,
                temperature=temperature,
                compression_ratio_threshold=compression_ratio_threshold,
                log_prob_threshold=log_prob_threshold,
                no_speech_threshold=no_speech_threshold,
                condition_on_previous_text=condition_on_previous_text
            )
            
            # Collect all segments
            text = ""
            segments_list = []
            for segment in segments:
                text += segment.text
                segments_list.append({
                    "id": segment.id,
                    "seek": segment.seek,
                    "start": segment.start,
                    "end": segment.end,
                    "text": segment.text,
                    "tokens": segment.tokens,
                    "temperature": segment.temperature,
                    "avg_logprob": segment.avg_logprob,
                    "compression_ratio": segment.compression_ratio,
                    "no_speech_prob": segment.no_speech_prob
                })
            
            result = {
                "text": text.strip(),
                "language": info.language,
                "language_probability": info.language_probability,
                "duration": info.duration,
                "segments": segments_list
            }
            
            return result
            
        except Exception as e:
            logging.error(f"Error transcribing audio with faster-whisper: {e}")
            return None

    def convert_to_wav(self, input_file: UploadFile, output_path: Optional[str] = None) -> str:
        """
        Convert incoming audio file to WAV format suitable for faster-whisper.
        faster-whisper supports many formats directly, but we convert to WAV for consistency.
        
        :param input_file: Uploaded audio file
        :param output_path: Path to save WAV file. If None, uses a temporary file.
        :return: Path to saved WAV file
        """
        import subprocess
        
        if output_path is None:
            # Create temporary file
            temp_dir = os.path.expanduser("~/.llama-runner")
            os.makedirs(temp_dir, exist_ok=True)
            output_path = os.path.join(temp_dir, "temp_audio.wav")

        # Save uploaded file to temporary location
        input_tmp_path = output_path + ".input"
        try:
            with open(input_tmp_path, "wb") as f:
                f.write(input_file.file.read())
        finally:
            input_file.file.close()

        # Convert to WAV using ffmpeg (faster-whisper still needs ffmpeg for format conversion)
        cmd = [
            "ffmpeg",
            "-y",
            "-i", input_tmp_path,
            "-ar", "16000",  # 16kHz is recommended for Whisper
            "-ac", "1",      # Mono
            "-c:a", "pcm_s16le",  # 16-bit PCM
            output_path
        ]

        try:
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr.decode(errors='ignore')
            raise RuntimeError(f"Error during audio conversion: {error_msg}")
        except FileNotFoundError:
            # ffmpeg not found, try to use faster-whisper's built-in loader
            # But this is less reliable, so we warn the user
            logging.warning("FFmpeg not found. faster-whisper may have limited audio format support.")
            # Just copy the file as-is and hope faster-whisper can handle it
            import shutil
            shutil.copy2(input_tmp_path, output_path)
        finally:
            if os.path.exists(input_tmp_path):
                os.remove(input_tmp_path)

        return output_path