import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/Form";

const PasswordSection = ({ form, inputs, onSubmit, button }) => {
  return (
    <div className="space-y-6" style={{ width: 'clamp(300px, 40vw, 600px)' }}>
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change your password
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pt-2">
          <div className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className='flex flex-col space-y-4'>
                  {inputs.map(input =>
                    <FormField
                      key={input.name}
                      control={form.control}
                      name={input.name}
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor={input.name}>{input.label}</Label>
                          <FormControl>
                            <Input id={input.name} type={input.type} placeholder={input.placeholder} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <div className="flex justify-end">
                    <Button type="submit">{button}</Button>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordSection;