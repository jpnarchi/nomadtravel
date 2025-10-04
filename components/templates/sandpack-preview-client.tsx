'use client'

import { SandpackPreview, useSandpack } from "@codesandbox/sandpack-react";
import { useEffect } from "react";

const ERROR_TYPES = [
    'Error',
    'SyntaxError',
    'TypeError',
    'ReferenceError',
    'DependencyNotFoundError',
    'ModuleNotFoundError',
    'CssSyntaxError'
] as const;

interface SandpackMessage {
    type?: string;
    title?: string;
    source?: string;
    status?: string;
    log?: Array<{ data: string[] }>;
}

export function SandpackPreviewClient() {
    const { listen } = useSandpack();

    function handleSandpackMessage(msg: SandpackMessage): void {
        if (isErrorMessage(msg)) {
            console.log(msg, 'ERROR');

            if (msg.source === 'browser') {
                console.log('Error browser:', msg);
            }
            return;
        }

        switch (msg.type) {
            case 'status':
                console.log('Status:', msg.status);
                break;
            case 'success':
                console.log('Success');
                break;
            case 'console':
                handleConsoleMessage(msg);
                break;
        }
    }

    function isErrorMessage(msg: SandpackMessage): boolean {
        return ERROR_TYPES.includes(msg.title as any);
    }

    function handleConsoleMessage(msg: SandpackMessage): void {
        const logData = msg.log?.[0]?.data?.[0];

        if (logData?.includes('Selected Element:')) {
            console.log('INPUT:', logData);
        }
    }

    useEffect(() => {
        const stopListening = listen((msg: SandpackMessage) => {
            handleSandpackMessage(msg);
        });

        return stopListening;
    }, [listen]);

    return (
        <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
            showNavigator={true}
            style={{ height: '100%', width: '100%' }}
        />
    );
}