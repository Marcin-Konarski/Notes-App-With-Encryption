import React from 'react'
import { useTheme } from '@/hooks/useTheme';
import { ModeToggle } from '@/components/ModeToggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';


const AppearanceSection = () => {
    const { theme } = useTheme()

    return (
        <div className="space-y-6" style={{ width: 'clamp(300px, 40vw, 600px)' }}>
            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                        Chagne how the page looks
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-sm border p-4">
                        <div className="flex items-center gap-3">
                            <div>
                                <h4 className="font-medium">Theme</h4>
                                <p className="text-muted-foreground text-sm">
                                    Current theme: {theme}
                                </p>
                            </div>
                        </div>
                        <ModeToggle />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default AppearanceSection
