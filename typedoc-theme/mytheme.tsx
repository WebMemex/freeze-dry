import {
    JSX,
    Application,
    DefaultTheme,
    DefaultThemeRenderContext,
    PageEvent,
    Reflection,
    ContainerReflection,
} from 'typedoc';

class MyThemeRenderContext extends DefaultThemeRenderContext {
    // DefaultThemeRenderContext does not have methods, but rather assigns its methods as
    // properties, in its constructor. So super.something() won’t work. As a workaround,
    // build a second instance to access the original implementations of its methods.
    private superish: DefaultThemeRenderContext
    constructor(theme, options) {
        super(theme, options)
        this.superish = new DefaultThemeRenderContext(theme, options)
    }

    override settings = () => null
    override primaryNavigation = () => null;
    override secondaryNavigation = (props: PageEvent<Reflection>) => (
        <>
            <h3>
                Contents
            </h3>
            {/* The default theme shows siblings if the reflection lacks children. Avoid this. */}
            {(props.model instanceof ContainerReflection && props.model.children?.length)
                ? this.superish.secondaryNavigation(props)
                : null
            }
        </>
    )
}

class MyTheme extends DefaultTheme {
    myThemeRenderContext: DefaultThemeRenderContext = new MyThemeRenderContext(this, this.application.options)

    override getRenderContext() {
        return this.myThemeRenderContext
    }
}

export function load(app: Application) {
    app.renderer.defineTheme("mytheme", MyTheme)
}
