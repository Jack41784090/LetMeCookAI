import { Sparkles } from 'lucide-react-native';
import Matter from 'matter-js';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

// Physics constants
const CIRCLE_RADIUS = 40;

interface PhysicsStyleCircle {
  id: string;
  name: string;
  position: { x: number; y: number };
}

interface PhysicsStylePotProps {
  imageUri: string;
  selectedStyles: string[];
  onRemoveStyle?: (id: string) => void;
  containerStyle?: any;
}

export const PhysicsStylePot = ({
  imageUri,
  selectedStyles,
  onRemoveStyle,
  containerStyle,
}: PhysicsStylePotProps) => {
  // Refs for physics engine
  const engineRef = useRef<Matter.Engine | null>(null);
  const worldRef = useRef<Matter.World | null>(null);
  const requestRef = useRef<number | null>(null);
  const bodiesRef = useRef<Record<string, Matter.Body>>({});
  const potRef = useRef<View>(null);

  // State for circle positions (separate from physics bodies)
  const [circles, setCircles] = useState<PhysicsStyleCircle[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Measure container dimensions
  const onContainerLayout = ({ nativeEvent: { layout } }: any) => {
    const { width, height } = layout;
    
    // Only update if dimensions have actually changed
    if (width !== dimensions.width || height !== dimensions.height) {
      setDimensions({ width, height });
      
      // Recreate physics world when container size changes
      if (width > 0 && height > 0) {
        // Clean up existing physics world if it exists
        if (engineRef.current && worldRef.current) {
          if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = null;
          }
          Matter.World.clear(worldRef.current, false);
          Matter.Engine.clear(engineRef.current);
          engineRef.current = null;
        }
        
        // Create new physics world with updated dimensions
        setupPhysicsWorld(width, height);
      }
    }
  };

  // Setup the physics engine and world
  const setupPhysicsWorld = (width: number, height: number) => {
    // Create engine
    if (engineRef.current) return;
    
    engineRef.current = Matter.Engine.create({ enableSleeping: false });
    worldRef.current = engineRef.current.world;
    
    // Set gravity
    engineRef.current.gravity.y = 0.5;
    
    // Clear existing world if it exists
    Matter.World.clear(worldRef.current, false);
    
    // Create walls (boundaries)
    const wallOptions = {
      isStatic: true,
      restitution: 0.5,
      friction: 0.1,
    };
    
    // Bottom curved wall (simulating the pot's curve)
    const curve = createCurvedBottom(width, height);
    Matter.World.add(worldRef.current, curve);
    
    // Left, right, and top walls
    const walls = [
      Matter.Bodies.rectangle(0, height / 2, 10, height, wallOptions),      // Left wall
      Matter.Bodies.rectangle(width, height / 2, 10, height, wallOptions),  // Right wall
      Matter.Bodies.rectangle(width / 2, 0, width, 10, wallOptions),        // Top wall
    ];
    Matter.World.add(worldRef.current, walls);
    
    // Recreate all existing style circles
    Object.keys(bodiesRef.current).forEach(id => {
      delete bodiesRef.current[id];
    });
    
    // Add all selected styles to the new physics world
    selectedStyles.forEach(styleId => {
      addCircleToPhysics(styleId);
    });
    
    // Start the physics simulation
    startPhysicsSimulation();
  };

  // Create a curved bottom for the pot
  const createCurvedBottom = (width: number, height: number) => {
    // Create multiple small static bodies to form a curved bottom
    const segments = 20;
    const segmentWidth = width / segments;
    
    // Match the curve height to the visual border radius (100px)
    const visualBorderRadius = 100;
    const curveHeight = Math.min(visualBorderRadius, height * 0.2);
    
    const bottomWalls = [];
    
    for (let i = 0; i <= segments; i++) {
      const xPos = i * segmentWidth;
      // Calculate y position based on a circular curve - inverted to dent down
      const normalizedX = (i / segments) * 2 - 1; // Range from -1 to 1
      
      // Calculate curve position that matches the visual border radius
      const yPos = height - curveHeight + curveHeight * Math.sqrt(1 - normalizedX * normalizedX);
      
      // Increase thickness for better collision detection
      const segment = Matter.Bodies.rectangle(
        xPos, 
        yPos,
        segmentWidth + 4, // Increased overlap
        20, // Increased thickness
        { isStatic: true, friction: 0.5, restitution: 0.2 }
      );
      
      // Rotate each segment to follow the curve tangent
      if (i > 0 && i < segments) {
        const angle = Math.atan2(
          -segments * curveHeight * normalizedX / Math.sqrt(1 - normalizedX * normalizedX),
          segments * segmentWidth
        );
        Matter.Body.rotate(segment, angle);
      }
      
      bottomWalls.push(segment);
    }
    
    // Add a final barrier at the visual bottom boundary (not below it)
    const safetyBarrier = Matter.Bodies.rectangle(
      width / 2,
      height - 5, // Place it just slightly below the visual bottom
      width,
      20,
      { isStatic: true, friction: 0.5, restitution: 0.2 }
    );
    bottomWalls.push(safetyBarrier);
    
    return bottomWalls;
  };

  // Start the physics simulation loop
  const startPhysicsSimulation = () => {
    if (!engineRef.current) return;
    
    const updatePhysics = () => {
      Matter.Engine.update(engineRef.current!, 1000 / 60);
      
      // Update circle positions from physics engine without creating cyclic references
      const updatedCircles = Object.entries(bodiesRef.current).map(([id, body]) => {
        return {
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1), // Capitalize the first letter
          position: { 
            x: body.position.x, 
            y: body.position.y 
          }
        };
      });
      
      setCircles(updatedCircles);
      
      requestRef.current = requestAnimationFrame(updatePhysics);
    };
    
    requestRef.current = requestAnimationFrame(updatePhysics);
  };

  // Add a new style circle to the physics world
  const addCircleToPhysics = (id: string) => {
    if (!worldRef.current || !dimensions.width) return;
    
    // Calculate random starting position in top area
    const x = Math.random() * (dimensions.width - CIRCLE_RADIUS * 2) + CIRCLE_RADIUS;
    const y = CIRCLE_RADIUS * 2;
    
    // Create physics body
    const body = Matter.Bodies.circle(x, y, CIRCLE_RADIUS, {
      restitution: 0.8, // Bounciness
      friction: 0.005,  // Low friction to make them roll well
      frictionAir: 0.001, // Low air resistance
      density: 0.001,  // Light to make them move more
    });
    
    // Add to physics world
    Matter.World.add(worldRef.current, body);
    
    // Store reference to body
    bodiesRef.current[id] = body;
  };

  // Remove a circle from the physics world
  const removeCircleFromPhysics = (id: string) => {
    if (!worldRef.current || !bodiesRef.current[id]) return;
    
    Matter.World.remove(worldRef.current, bodiesRef.current[id]);
    delete bodiesRef.current[id];
  };

  // Handle tap on a style circle
  const handleCircleTap = (id: string) => {
    onRemoveStyle && onRemoveStyle(id);
  };

  const getCircleSytle = (circle: PhysicsStyleCircle) => {
    return {
        position: 'absolute' as const,
        left: circle.position.x - CIRCLE_RADIUS,
        top: circle.position.y - CIRCLE_RADIUS,
        width: CIRCLE_RADIUS * 2,
        height: CIRCLE_RADIUS * 2,
        borderRadius: CIRCLE_RADIUS,
        backgroundColor: '#1e4d8f',
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
      };
  }

  // Update circles based on selectedStyles changes
  useEffect(() => {
    if (!worldRef.current || dimensions.width === 0 || dimensions.height === 0) return;
    
    // Add new styles that don't exist in circles
    selectedStyles.forEach(styleId => {
      if (!bodiesRef.current[styleId]) {
        addCircleToPhysics(styleId);
      }
    });
    
    // Remove circles that are no longer in selectedStyles
    Object.keys(bodiesRef.current).forEach(id => {
      if (!selectedStyles.includes(id)) {
        removeCircleFromPhysics(id);
      }
    });
  }, [selectedStyles, dimensions]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      if (engineRef.current && worldRef.current) {
        Matter.World.clear(worldRef.current, false);
        Matter.Engine.clear(engineRef.current);
      }
    };
  }, []);

  return (
    <View 
      style={[styles.container, containerStyle]} 
      onLayout={onContainerLayout}
      ref={potRef}
    >
      {/* Render circles based on physics positions */}
      {circles.map(circle => (
        <TouchableWithoutFeedback 
          key={circle.id} 
          onPress={() => handleCircleTap(circle.id)}
        >
          <View
            style={getCircleSytle(circle)}
          >
            <Sparkles color="#fff" size={16} style={styles.icon} />
            <Text numberOfLines={1} style={styles.circleName}>{circle.name}</Text>
          </View>
        </TouchableWithoutFeedback>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  icon: {
    marginBottom: 2,
  },
  circleName: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '80%',
  }
});