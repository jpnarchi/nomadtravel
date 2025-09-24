import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Button } from './ui/button';
import { Mic, MicOff } from 'lucide-react';

export function MicrophoneButton() {
    const {
        // transcript
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    const startListening = () => {
        resetTranscript();
        SpeechRecognition.startListening({
            continuous: true,
            language: 'en-US'
        });
    };

    const stopListening = () => {
        SpeechRecognition.stopListening();
    };

    const toggle = () => {
        if (!browserSupportsSpeechRecognition) return;

        if (listening) {
            stopListening();
        } else {
            startListening();
        }
    };

    // if (!browserSupportsSpeechRecognition) {
    //     return null;
    // }

    return (
        <Button
            onClick={toggle}
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
        >
            {listening ? (
                <MicOff className="w-5 h-5 text-red-500" />
            ) : (
                <Mic className="w-5 h-5 text-gray" />
            )}
        </Button>
    );
}