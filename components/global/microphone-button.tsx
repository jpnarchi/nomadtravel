import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Button } from '../ui/button';
import { Mic, MicOff } from 'lucide-react';

export function MicrophoneButton({ isDisabled }: { isDisabled: boolean }) {
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
            className="h-12 w-12 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
            disabled={isDisabled}
        >
            {listening ? (
                <MicOff className="w-6 h-6 text-red-500" />
            ) : (
                <Mic className="w-6 h-6 text-gray" />
            )}
        </Button>
    );
}